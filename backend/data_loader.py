# backend/data_loader.py
import json
import os
import sqlite3
from database import get_db_connection # Importa nossa função de conexão

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Mapeamento de nome de arquivo para nome do setor principal
FILENAME_TO_SETOR = {
    "equipamentosteste.json": "TESTE",  # <<< Apenas para Desenvolvimento
    "equipamentosvegetais.json": "VEGETAIS",
    "equipamentossafra.json": "SAFRA",
    "equipamentosautoclaves.json": "AUTOCLAVES",
    "equipamentospreparacao.json": "PREPARACAO",
    "equipamentostorres.json": "TORRES"
}

def insert_equipamento(cursor, equipamento_data):
    """Insere um único equipamento no banco de dados."""
    columns = [
        'tag_motor', 'setor_principal', 'subsetor_nivel1', 'subsetor_nivel2',
        'nome_componente', 'indice_componente', 'potencia_kw_nominal',
        'potencia_cv_nominal', 'tensao_v_nominal', 'corrente_a_nominal',
        'rotacao_rpm_nominal', 'marca_nominal', 'modelo_nominal',
        'rolamento_d_nominal', 'rolamento_t_nominal', 'regulagem_corrente_nominal'
    ]
    placeholders = ', '.join(['?'] * len(columns))
    sql = f"INSERT OR IGNORE INTO equipamentos ({', '.join(columns)}) VALUES ({placeholders})"
    data_tuple = (
        equipamento_data.get('tag_motor'),
        equipamento_data.get('setor_principal'),
        equipamento_data.get('subsetor_nivel1'),
        equipamento_data.get('subsetor_nivel2'),
        equipamento_data.get('nome_componente'),
        equipamento_data.get('indice_componente', 0),
        equipamento_data.get('potencia_kw_nominal'),
        equipamento_data.get('potencia_cv_nominal'),
        equipamento_data.get('tensao_v_nominal'),
        equipamento_data.get('corrente_a_nominal'),
        equipamento_data.get('rotacao_rpm_nominal'),
        equipamento_data.get('marca_nominal'),
        equipamento_data.get('modelo_nominal'),
        equipamento_data.get('rolamento_d_nominal'),
        equipamento_data.get('rolamento_t_nominal'),
        equipamento_data.get('regulagem_corrente_nominal')
    )
    try:
        cursor.execute(sql, data_tuple)
    except sqlite3.Error as e:
        print(f"Erro ao inserir {equipamento_data.get('tag_motor')}: {e}")
        print(f"Dados: {data_tuple}")


def process_standard_structure_json(cursor, file_path, setor_principal):
    print(f"\nProcessando arquivo: {os.path.basename(file_path)} para o setor {setor_principal}")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        print(f"Arquivo {os.path.basename(file_path)} está vazio ou não é JSON válido.")
        return
    
    json_setor_key = list(data.keys())[0]
    setor_data = data[json_setor_key]

    for subsetor1_nome, subsetor1_val in setor_data.items():
        for subsetor2_nome, subsetor2_val in subsetor1_val.items():
            if isinstance(subsetor2_val, dict) and 'tag_motor' in subsetor2_val:
                motor_data = subsetor2_val
                equip_data_to_insert = motor_data.copy()
                equip_data_to_insert['setor_principal'] = setor_principal
                equip_data_to_insert['subsetor_nivel1'] = subsetor1_nome
                equip_data_to_insert['subsetor_nivel2'] = None
                equip_data_to_insert['nome_componente'] = subsetor2_nome 
                equip_data_to_insert['indice_componente'] = 0
                print(f"  Inserindo (motor direto sob sub2): {equip_data_to_insert['tag_motor']} ({setor_principal} > {subsetor1_nome} > {subsetor2_nome})")
                insert_equipamento(cursor, equip_data_to_insert)
            elif isinstance(subsetor2_val, dict):
                for componente_nome, componente_val in subsetor2_val.items():
                    motores_a_processar = []
                    if isinstance(componente_val, list):
                        motores_a_processar.extend(componente_val)
                    elif isinstance(componente_val, dict) and 'tag_motor' in componente_val:
                        motores_a_processar.append(componente_val)
                    else:
                        print(f"  Estrutura inesperada para {setor_principal}/{subsetor1_nome}/{subsetor2_nome}/{componente_nome}. Pulando.")
                        continue
                    for i, motor_data in enumerate(motores_a_processar):
                        if not isinstance(motor_data, dict) or 'tag_motor' not in motor_data:
                            print(f"  Item inválido em lista de motores para {componente_nome}. Pulando: {motor_data}")
                            continue
                        equip_data_to_insert = motor_data.copy()
                        equip_data_to_insert['setor_principal'] = setor_principal
                        equip_data_to_insert['subsetor_nivel1'] = subsetor1_nome
                        equip_data_to_insert['subsetor_nivel2'] = subsetor2_nome
                        equip_data_to_insert['nome_componente'] = componente_nome
                        equip_data_to_insert['indice_componente'] = i if isinstance(componente_val, list) and len(motores_a_processar) > 0 else 0
                        print(f"  Inserindo (motor sob comp): {equip_data_to_insert['tag_motor']} ({setor_principal} > {subsetor1_nome} > {subsetor2_nome} > {componente_nome})")
                        insert_equipamento(cursor, equip_data_to_insert)
            elif isinstance(subsetor2_val, list):
                componente_nome_para_lista = subsetor2_nome 
                motores_a_processar = subsetor2_val
                for i, motor_data in enumerate(motores_a_processar):
                    if not isinstance(motor_data, dict) or 'tag_motor' not in motor_data:
                        print(f"  Item inválido na lista direta de motores para {subsetor2_nome}. Pulando: {motor_data}")
                        continue
                    equip_data_to_insert = motor_data.copy()
                    equip_data_to_insert['setor_principal'] = setor_principal
                    equip_data_to_insert['subsetor_nivel1'] = subsetor1_nome
                    equip_data_to_insert['subsetor_nivel2'] = subsetor2_nome 
                    equip_data_to_insert['nome_componente'] = componente_nome_para_lista
                    equip_data_to_insert['indice_componente'] = i
                    print(f"  Inserindo (lista direta): {equip_data_to_insert['tag_motor']} ({setor_principal} > {subsetor1_nome} > {subsetor2_nome} [lista])")
                    insert_equipamento(cursor, equip_data_to_insert)
            else:
                print(f"  Tipo inesperado para subsetor2_val: {type(subsetor2_val)} em {setor_principal}/{subsetor1_nome}/{subsetor2_nome}. Pulando.")


def process_safra_json(cursor, file_path, setor_principal):
    print(f"\nProcessando arquivo: {os.path.basename(file_path)} ({setor_principal})") # Ajustado para usar setor_principal
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data or "safra" not in data: # A chave principal no JSON é "safra"
        print(f"Arquivo {os.path.basename(file_path)} está vazio ou não contém a chave 'safra'.")
        return

    safra_data = data["safra"]

    for subsetor1_nome, subsetor1_val in safra_data.items(): # ex: "manzini", "navatta", "torre_safra"
        for equipamento_ou_componente_nome, equipamento_ou_componente_val in subsetor1_val.items():
            motores_a_processar = []
            if isinstance(equipamento_ou_componente_val, dict) and 'tag_motor' in equipamento_ou_componente_val:
                motores_a_processar.append(equipamento_ou_componente_val)
            elif isinstance(equipamento_ou_componente_val, list):
                motores_a_processar.extend(equipamento_ou_componente_val)
            else:
                # Adicionar um log se não for nem dict com tag_motor nem lista, para debug
                # Pode ser que haja outra estrutura, como um dict que contém outros dicts antes dos motores
                # Ex: "safra" -> "manzini" -> "efeito_3_manzini" (este é o motor)
                # Mas se "manzini" tivesse "bombas" -> "bba_principal" (motor), a lógica atual falharia aqui.
                # Por enquanto, vamos assumir que o nível abaixo de subsetor1_val é ou motor ou lista de motores.
                print(f"  Estrutura inesperada para {setor_principal}/{subsetor1_nome}/{equipamento_ou_componente_nome}. Valor: {type(equipamento_ou_componente_val)}. Pulando.")
                continue

            for i, motor_data in enumerate(motores_a_processar):
                if not isinstance(motor_data, dict) or 'tag_motor' not in motor_data:
                    print(f"  Item inválido em motores para {equipamento_ou_componente_nome}. Pulando: {motor_data}")
                    continue

                equip_data_to_insert = motor_data.copy()
                equip_data_to_insert['setor_principal'] = setor_principal
                equip_data_to_insert['subsetor_nivel1'] = subsetor1_nome
                equip_data_to_insert['subsetor_nivel2'] = None # Para SAFRA, parece não haver um nível 2 claro antes do equipamento
                equip_data_to_insert['nome_componente'] = equipamento_ou_componente_nome
                equip_data_to_insert['indice_componente'] = i if len(motores_a_processar) > 1 else 0

                print(f"  Inserindo (SAFRA): {equip_data_to_insert['tag_motor']} ({setor_principal} > {subsetor1_nome} > {equipamento_ou_componente_nome})")
                insert_equipamento(cursor, equip_data_to_insert)


def load_all_data():
    """Carrega dados de todos os arquivos JSON para o banco de dados."""
    conn = get_db_connection()
    cursor = conn.cursor()

    print("Limpando tabela 'equipamentos' existente...")
    cursor.execute("DELETE FROM equipamentos")
    conn.commit() 

    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".json"):
            file_path = os.path.join(DATA_DIR, filename)
            setor_principal_nome = FILENAME_TO_SETOR.get(filename)

            if not setor_principal_nome:
                print(f"Setor principal não mapeado para o arquivo {filename}. Pulando.")
                continue

            if filename in ["equipamentosteste.json","equipamentosvegetais.json", "equipamentosautoclaves.json", "equipamentospreparacao.json", "equipamentostorres.json"]:
                process_standard_structure_json(cursor, file_path, setor_principal_nome)
            elif filename == "equipamentossafra.json":
                process_safra_json(cursor, file_path, setor_principal_nome) # Chamada para a nova função
            else:
                print(f"Estrutura de processamento não definida para {filename}. Pulando.")

    conn.commit() 
    conn.close()
    print("\nCarregamento de dados concluído.")


if __name__ == '__main__':
    print("Iniciando carregador de dados...")
    load_all_data()

    conn_verify = get_db_connection()
    cursor_verify = conn_verify.cursor()
    cursor_verify.execute("SELECT COUNT(*) FROM equipamentos")
    count = cursor_verify.fetchone()[0]
    print(f"\nTotal de equipamentos na base de dados: {count}")
    if count > 0:
        cursor_verify.execute("SELECT tag_motor, setor_principal, subsetor_nivel1, subsetor_nivel2, nome_componente FROM equipamentos LIMIT 5")
        print("Alguns equipamentos carregados:")
        for row in cursor_verify.fetchall():
            print(f"  - Tag: {row['tag_motor']}, Setor: {row['setor_principal']}, Sub1: {row['subsetor_nivel1']}, Sub2: {row['subsetor_nivel2']}, Comp: {row['nome_componente']}")
    conn_verify.close()